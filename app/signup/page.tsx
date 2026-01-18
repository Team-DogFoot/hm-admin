'use client';
import { useSignUp } from '@/query/query/users';
import styles from './page.module.css';
import { SignUp } from '@/types/signUp';
import { SubmitHandler, useForm } from 'react-hook-form';
import { useIsAdmin } from '@/hooks/useIAdmin';

export default function SignUp() {
  const { mutateAsync: signUp, isPending } = useSignUp();
  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors },
  } = useForm<SignUp>({ mode: 'onChange' });

  const onSubmit: SubmitHandler<SignUp> = async (data) => {
    try {
      const result = await signUp(data);
      if (result && result.errorMessage) {
        alert(result.errorMessage);
      } else {
        window.location.href = '/';
      }
    } catch (error: any) {
      if (error?.response?.status === 409) {
        alert('이미 등록된 이메일입니다.');
      } else {
        alert(error?.response?.data?.message || '회원가입에 실패했습니다.');
      }
    }
  };

  useIsAdmin();

  return (
    <main className={styles.mainContainer}>
      <div className={styles.subTitle}>회원가입</div>
      <form className={styles.signUpBox} onSubmit={handleSubmit(onSubmit)}>
        <div className={styles.logoContainer}></div>
        <div className={styles.titleContainer}></div>
        <div className={styles.inputContainer}>
          <label className={styles.signUpLabel}>이메일</label>
          <input
            className={styles.signUpInput}
            placeholder="이메일을 입력해주세요."
            {...register('userEmail', {
              required: '이메일을 입력해주세요.',
              pattern: {
                value:
                  /^[0-9a-zA-Z]([-_\.]?[0-9a-zA-Z])*@[0-9a-zA-Z]([-_\.]?[0-9a-zA-Z])*\.[a-zA-Z]{2,3}$/i,
                message: '이메일 형식이 아닙니다.',
              },
            })}
          />
          {errors?.userEmail ? (
            <p className="error">{errors.userEmail?.message}</p>
          ) : null}

          <label className={styles.signUpLabel}>비밀번호</label>
          <input
            className={styles.signUpInput}
            type="password"
            placeholder="8자리 이상의 비밀번호를 입력해주세요."
            {...register('userPassword', {
              required: '비밀번호는 필수 입력입니다.',
              minLength: {
                value: 8,
                message: '8자리 이상 비밀번호를 사용하세요.',
              },
            })}
          />
          {errors?.userPassword ? (
            <p className="error">{errors.userPassword?.message}</p>
          ) : null}

          <label className={styles.signUpLabel}>비밀번호 확인</label>
          <input
            className={styles.signUpInput}
            type="password"
            placeholder="8자리 이상의 비밀번호를 입력해주세요."
            {...register('checkPassword', {
              required: '비밀번호 확인은 필수 입력입니다.',
              minLength: {
                value: 8,
                message: '8자리 이상 비밀번호를 사용하세요.',
              },
              validate: {
                checkPassword: (value) =>
                  value === getValues('userPassword') ||
                  '비밀번호 확인이 일치하지 않습니다.',
              },
            })}
          />
          {errors?.checkPassword ? (
            <p className="error">{errors.checkPassword?.message}</p>
          ) : null}
        </div>
        <div className={styles.buttonContainer}>
          <button
            className={styles.bigButton}
            type="submit"
            disabled={isPending}
          >
            회원가입
          </button>
        </div>
      </form>
    </main>
  );
}
